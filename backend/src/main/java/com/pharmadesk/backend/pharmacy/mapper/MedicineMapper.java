package com.pharmadesk.backend.pharmacy.mapper;

import com.pharmadesk.backend.pharmacy.dto.MedicineDTO;
import com.pharmadesk.backend.model.Medicine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface MedicineMapper {
    com.pharmadesk.backend.pharmacy.dto.MedicineDTO toDto(com.pharmadesk.backend.model.Medicine medicine);
    com.pharmadesk.backend.model.Medicine toEntity(com.pharmadesk.backend.pharmacy.dto.MedicineDTO dto);
}
